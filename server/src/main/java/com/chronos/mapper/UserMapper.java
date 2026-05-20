package com.chronos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chronos.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
