package com.wms.module.reporting.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.SimpleMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class RabbitMqConfig {

    public static final String QUEUE_NAME = "wms.report.task.queue";
    public static final String EXCHANGE_NAME = "wms.report.exchange";
    public static final String ROUTING_KEY = "report.generate";

    @Bean
    public Queue reportTaskQueue() {
        return QueueBuilder.durable(QUEUE_NAME).build();
    }

    @Bean
    public TopicExchange reportTopicExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding reportBinding(Queue reportTaskQueue, TopicExchange reportTopicExchange) {
        return BindingBuilder.bind(reportTaskQueue).to(reportTopicExchange).with(ROUTING_KEY);
    }

    @Bean
    public SimpleMessageConverter messageConverter() {
        SimpleMessageConverter converter = new SimpleMessageConverter();
        converter.setAllowedListPatterns(List.of("com.wms.*", "java.util.*", "java.lang.*"));
        return converter;
    }
}
