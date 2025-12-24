
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat";
import { cn } from "@/lib/utils";
import { type Message } from "@/types/chat";

export default function Chat() {
    const [newMessage, setNewMessage] = useState("");
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messages = [] } = useQuery({
        queryKey: ['chat-messages'],
        queryFn: chatService.getMessages
    });

    const sendMessageMutation = useMutation({
        mutationFn: chatService.sendMessage,
        onSuccess: (newMsg) => {
            queryClient.setQueryData(['chat-messages'], (old: Message[] = []) => [...old, newMsg]);
            setNewMessage("");

            // Simulate reply
            setTimeout(async () => {
                const reply = await chatService.waitForReply();
                queryClient.setQueryData(['chat-messages'], (current: Message[] = []) => {
                    // Prevent duplicate replies in strict mode/mock
                    if (current.some(m => m.id === reply.id)) return current;
                    return [...current, reply];
                });
            }, 100);
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Fale com o Contador</h2>
                <p className="text-muted-foreground">Tire suas dúvidas diretamente pelo chat.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm">
                <CardHeader className="bg-white border-b py-3 flex flex-row items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">SC</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-sm font-medium">Seu Contador</CardTitle>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Online agora
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col bg-gray-50/50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex", msg.isMine ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    msg.isMine
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                                )}>
                                    {msg.text}
                                    <span className={cn(
                                        "block text-[10px] mt-1 opacity-70",
                                        msg.isMine ? "text-primary-foreground/80" : "text-gray-400"
                                    )}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <Input
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
