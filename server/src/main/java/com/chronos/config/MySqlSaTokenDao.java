package com.chronos.config;

import cn.dev33.satoken.dao.SaTokenDao;

import javax.sql.DataSource;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/** Persists Sa-Token state in MySQL so API restarts do not log users out. */
public class MySqlSaTokenDao implements SaTokenDao {

    private static final String STRING = "STRING";
    private static final String OBJECT = "OBJECT";
    private final DataSource dataSource;

    public MySqlSaTokenDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public String get(String key) {
        StoredValue value = find(key, STRING);
        return value == null ? null : value.value();
    }

    @Override
    public void set(String key, String value, long timeout) {
        upsert(key, STRING, value, timeout);
    }

    @Override
    public void update(String key, String value) {
        updateValue(key, STRING, value);
    }

    @Override
    public void delete(String key) {
        deleteByKey(key);
    }

    @Override
    public long getTimeout(String key) {
        return getTimeout(key, STRING);
    }

    @Override
    public void updateTimeout(String key, long timeout) {
        updateTimeout(key, STRING, timeout);
    }

    @Override
    public Object getObject(String key) {
        StoredValue value = find(key, OBJECT);
        return value == null ? null : deserialize(value.value());
    }

    @Override
    public void setObject(String key, Object value, long timeout) {
        upsert(key, OBJECT, serialize(value), timeout);
    }

    @Override
    public void updateObject(String key, Object value) {
        updateValue(key, OBJECT, serialize(value));
    }

    @Override
    public void deleteObject(String key) {
        deleteByKey(key);
    }

    @Override
    public long getObjectTimeout(String key) {
        return getTimeout(key, OBJECT);
    }

    @Override
    public void updateObjectTimeout(String key, long timeout) {
        updateTimeout(key, OBJECT, timeout);
    }

    @Override
    public List<String> searchData(String prefix, String keyword, int start, int size, boolean sortType) {
        String like = (prefix == null ? "" : prefix) + "%" + (keyword == null ? "" : keyword) + "%";
        String order = sortType ? "DESC" : "ASC";
        String sql = "SELECT store_key FROM sa_token_store WHERE store_key LIKE ? ORDER BY store_key " + order + " LIMIT ? OFFSET ?";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, like);
            statement.setInt(2, Math.max(0, size));
            statement.setInt(3, Math.max(0, start));
            try (ResultSet result = statement.executeQuery()) {
                List<String> keys = new ArrayList<>();
                while (result.next()) keys.add(result.getString(1));
                return keys;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("读取登录会话失败", exception);
        }
    }

    private StoredValue find(String key, String type) {
        String sql = "SELECT value_data, expires_at FROM sa_token_store WHERE store_key = ? AND value_type = ?";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, key);
            statement.setString(2, type);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) return null;
                Timestamp expiresAt = result.getTimestamp("expires_at");
                if (expiresAt != null && !expiresAt.toInstant().isAfter(Instant.now())) {
                    deleteByKey(key);
                    return null;
                }
                return new StoredValue(result.getString("value_data"), expiresAt);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("读取登录会话失败", exception);
        }
    }

    private void upsert(String key, String type, String value, long timeout) {
        Timestamp expiresAt = toExpiry(timeout);
        String update = "UPDATE sa_token_store SET value_type = ?, value_data = ?, expires_at = ? WHERE store_key = ?";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(update)) {
            statement.setString(1, type);
            statement.setString(2, value);
            statement.setTimestamp(3, expiresAt);
            statement.setString(4, key);
            if (statement.executeUpdate() != 0) return;
        } catch (SQLException exception) {
            throw new IllegalStateException("保存登录会话失败", exception);
        }
        String insert = "INSERT INTO sa_token_store (store_key, value_type, value_data, expires_at) VALUES (?, ?, ?, ?)";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(insert)) {
            statement.setString(1, key);
            statement.setString(2, type);
            statement.setString(3, value);
            statement.setTimestamp(4, expiresAt);
            statement.executeUpdate();
        } catch (SQLException exception) {
            updateValue(key, type, value);
            updateTimeout(key, type, timeout);
        }
    }

    private void updateValue(String key, String type, String value) {
        String sql = "UPDATE sa_token_store SET value_type = ?, value_data = ? WHERE store_key = ?";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, type);
            statement.setString(2, value);
            statement.setString(3, key);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new IllegalStateException("更新登录会话失败", exception);
        }
    }

    private void deleteByKey(String key) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("DELETE FROM sa_token_store WHERE store_key = ?")) {
            statement.setString(1, key);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new IllegalStateException("删除登录会话失败", exception);
        }
    }

    private long getTimeout(String key, String type) {
        StoredValue value = find(key, type);
        if (value == null) return NOT_VALUE_EXPIRE;
        if (value.expiresAt() == null) return NEVER_EXPIRE;
        return Math.max(0, Duration.between(Instant.now(), value.expiresAt().toInstant()).toSeconds());
    }

    private void updateTimeout(String key, String type, long timeout) {
        String sql = "UPDATE sa_token_store SET expires_at = ? WHERE store_key = ? AND value_type = ?";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setTimestamp(1, toExpiry(timeout));
            statement.setString(2, key);
            statement.setString(3, type);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new IllegalStateException("更新登录会话过期时间失败", exception);
        }
    }

    private Timestamp toExpiry(long timeout) {
        return timeout == NEVER_EXPIRE ? null : Timestamp.from(Instant.now().plusSeconds(Math.max(0, timeout)));
    }

    private String serialize(Object value) {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ObjectOutputStream stream = new ObjectOutputStream(bytes)) {
            stream.writeObject(value);
            return Base64.getEncoder().encodeToString(bytes.toByteArray());
        } catch (Exception exception) {
            throw new IllegalStateException("序列化登录会话失败", exception);
        }
    }

    private Object deserialize(String value) {
        try (ByteArrayInputStream bytes = new ByteArrayInputStream(Base64.getDecoder().decode(value));
             ObjectInputStream stream = new ObjectInputStream(bytes)) {
            return stream.readObject();
        } catch (Exception exception) {
            throw new IllegalStateException("反序列化登录会话失败", exception);
        }
    }

    private record StoredValue(String value, Timestamp expiresAt) { }
}
