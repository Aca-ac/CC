package com.chronos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chronos.entity.Project;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
