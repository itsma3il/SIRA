"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-conversation-chat";

interface ChatMinimapProps {
    messages: ChatMessage[];
    onNavigate: (messageId: string) => void;
}

export function ChatMinimap({ messages, onNavigate }: ChatMinimapProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Show minimap only when there are multiple messages
    useEffect(() => {
        setIsVisible(messages.length > 3);
    }, [messages.length]);

    if (!isVisible) return null;

    const recommendations = messages.filter(
        (msg) => msg.role === "assistant" && msg.metadata?.type === "recommendation_generated"
    );
    const regularMessages = messages.filter(
        (msg) => !(msg.role === "assistant" && msg.metadata?.type === "recommendation_generated")
    );

    const allItems = messages.map((msg, idx) => ({
        id: msg.id,
        index: idx,
        isRecommendation: msg.role === "assistant" && msg.metadata?.type === "recommendation_generated",
        isAssistant: msg.role === "assistant" && !(msg.metadata?.type === "recommendation_generated"),
    })).filter(item => !item.isAssistant && !item.isRecommendation || item.isRecommendation); // Show only regular messages and recommendations

    const handleClick = (messageId: string) => {
        onNavigate(messageId);
        // Scroll to the message element
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5 p-3 opacity-35 hover:opacity-80 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg"
        >
            {/* Gradient overlay - top */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-background/80 to-transparent pointer-events-none rounded-t-lg" />
            {/* Gradient overlay - bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-background/80 to-transparent pointer-events-none rounded-b-lg" />
            
            <div className="flex flex-col gap-1.5 relative z-10">
                {allItems.map((item) => {
                    const isHovered = hoveredIndex === item.index;
                    const scale = isHovered ? 1.2 : 1;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item.id)}
                            onMouseEnter={() => setHoveredIndex(item.index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={cn(
                                "relative rounded transition-all duration-200 cursor-pointer hover:opacity-100",
                                item.isRecommendation
                                    ? "bg-primary/60 hover:bg-primary/80"
                                    : "bg-muted/60 hover:bg-muted/80"
                            )}
                            style={{
                                width: "16px",
                                height: item.isRecommendation ? "6px" : "4px",
                                transform: `scale(${scale})`,
                                transformOrigin: "right center",
                            }}
                            title={
                                item.isRecommendation
                                    ? "Recommendation"
                                    : "Message"
                            }
                        />
                    );
                })}
            </div>

        </div>
    );
}
