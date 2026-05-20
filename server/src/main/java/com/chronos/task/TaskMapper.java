package com.chronos.task;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chronos.entity.Task;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskMapper extends BaseMapper<Task> {
    // 继承 BaseMapper 后，你就自动拥有了 insert、delete、update、selectList 等所有基础 CRUD 方法
}
