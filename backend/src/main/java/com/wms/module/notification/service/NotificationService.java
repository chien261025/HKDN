package com.wms.module.notification.service;

import com.wms.module.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    // Bộ nhớ đệm lưu trữ 50 thông báo gần nhất để hiển thị khi người dùng tải lại trang
    private final List<NotificationMessage> recentNotifications = new CopyOnWriteArrayList<>();
    
    // Danh sách các kết nối Server-Sent Events (SSE) mở
    private final Set<SseEmitter> sseEmitters = ConcurrentHashMap.newKeySet();

    public void broadcast(NotificationMessage notification) {
        if (notification.getId() == null) {
            notification.setId(UUID.randomUUID().toString());
        }
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(Instant.now());
        }

        // Lưu vào đầu danh sách, giữ tối đa 50 phần tử
        recentNotifications.add(0, notification);
        while (recentNotifications.size() > 50) {
            recentNotifications.remove(recentNotifications.size() - 1);
        }

        log.info("Phat thong bao Real-time: [{}] {} - {}", notification.getType(), notification.getTitle(), notification.getMessage());

        // 1. Gửi qua WebSocket STOMP topic
        try {
            messagingTemplate.convertAndSend("/topic/notifications", notification);
        } catch (Exception e) {
            log.warn("Loi khi gui qua WebSocket: {}", e.getMessage());
        }

        // 2. Gửi qua SSE cho các client kết nối qua HTTP stream
        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : sseEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }
        sseEmitters.removeAll(deadEmitters);
    }

    public List<NotificationMessage> getRecentNotifications() {
        return new ArrayList<>(recentNotifications);
    }

    public void markAsRead(String id) {
        recentNotifications.stream()
                .filter(n -> id.equals(n.getId()))
                .findFirst()
                .ifPresent(n -> n.setRead(true));
    }

    public void markAllAsRead() {
        recentNotifications.forEach(n -> n.setRead(true));
    }

    public SseEmitter subscribeSse() {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 phút timeout
        sseEmitters.add(emitter);

        emitter.onCompletion(() -> sseEmitters.remove(emitter));
        emitter.onTimeout(() -> sseEmitters.remove(emitter));
        emitter.onError(e -> sseEmitters.remove(emitter));

        try {
            // Gửi sự kiện khởi tạo kết nối
            emitter.send(SseEmitter.event().name("INIT").data("Connected to Smart WMS Real-Time Notification Stream"));
        } catch (IOException e) {
            sseEmitters.remove(emitter);
        }

        return emitter;
    }
}
