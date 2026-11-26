package com.wms.module.smartquery.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SqlPlan(Boolean inScope, String sql, String directReply) {
    public SqlPlan(String sql) {
        this(true, sql, null);
    }
}
