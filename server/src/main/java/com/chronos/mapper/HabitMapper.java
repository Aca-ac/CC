package com.chronos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chronos.entity.Habit;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HabitMapper extends BaseMapper<Habit> {
}
