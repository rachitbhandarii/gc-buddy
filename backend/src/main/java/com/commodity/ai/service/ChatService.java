package com.commodity.ai.service;

import com.commodity.ai.factory.AiModelFactory;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@Service
public class ChatService {

    StreamingChatModel gemini;

    public ChatService(){
        this.gemini = AiModelFactory.createGeminiStreamingChatModel();
    }

    public ResponseBodyEmitter chat(String query) {
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();

        CompletableFuture.runAsync(() -> {
            try {
                gemini.chat(query, new StreamingChatResponseHandler() {
                    @Override
                    public void onPartialResponse(String partialResponse) {
                        try {
                            emitter.send(partialResponse);
                            System.out.println(partialResponse);
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onCompleteResponse(ChatResponse completeResponse) {
                        emitter.complete();
                    }

                    @Override
                    public void onError(Throwable error) {
                        emitter.completeWithError(error);
                    }
                });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
//    Test
//    @PostConstruct
//    public void init() {
//        System.out.println(chat("Write a paragraph on India in 400-500 words."));
//    }

}
