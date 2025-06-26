package com.commodity.ai.service;

import com.commodity.ai.assistant.Assistant;
import com.commodity.ai.factory.AiModelFactory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.rag.DefaultRetrievalAugmentor;
import dev.langchain4j.rag.RetrievalAugmentor;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.WebSearchContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.rag.query.router.DefaultQueryRouter;
import dev.langchain4j.rag.query.router.QueryRouter;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.web.search.WebSearchEngine;
import jakarta.annotation.PostConstruct;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import dev.langchain4j.web.search.tavily.TavilyWebSearchEngine;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.Scanner;
import java.util.logging.Logger;

@Service
public class RagService {

    private final EmbeddingService embeddingService;

    @Autowired
    public RagService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @PostConstruct
    private Assistant createAssistant() {

        ContentRetriever embeddingStoreContentRetriever = embeddingService.getEmbeddingStoreContentRetriever();

        WebSearchEngine webSearchEngine = TavilyWebSearchEngine.builder()
                .apiKey(System.getenv("TVLY_API_KEY"))
                .build();

        ContentRetriever webSearchContentRetriever = WebSearchContentRetriever.builder()
                .webSearchEngine(webSearchEngine)
                .maxResults(3)
                .build();

        QueryRouter queryRouter = new DefaultQueryRouter(embeddingStoreContentRetriever, webSearchContentRetriever);
//        QueryRouter queryRouter = new DefaultQueryRouter(embeddingStoreContentRetriever);

        RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
                .queryRouter(queryRouter)
                .build();
        Query query = new Query("search web for latest news on iran israel war");
//        queryRouter.route(query);
        System.out.println(queryRouter.route(query));
        StreamingChatModel streamingModel = AiModelFactory.createGeminiStreamingChatModel();
        ChatModel model = AiModelFactory.createGeminiChatModel();

        return AiServices.builder(Assistant.class)
                .chatModel(model)
                .streamingChatModel(streamingModel)
                .retrievalAugmentor(retrievalAugmentor)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
    }

    public String chat(String query) {
        Assistant assistant = createAssistant();
        return assistant.chat(query);
    }

    @PostConstruct
    public void init() {
        try (Scanner scanner = new Scanner(System.in)) {
            Assistant assistant = createAssistant();
            while (true) {
                System.out.println("==================================================");
                System.out.print("User: ");
                String userQuery = scanner.nextLine();
                System.out.println("==================================================");

                if ("exit".equalsIgnoreCase(userQuery)) {
                    break;
                } else if ("context".equalsIgnoreCase(userQuery)) {
                    System.out.println("==================================================");
                    System.out.print("Context: ");
                    String context = scanner.nextLine();
                    embeddingService.embed(context);
                    continue;
                }

                String agentAnswer = assistant.chat(userQuery);
                System.out.println("==================================================");
                System.out.println("Assistant: " + agentAnswer);
            }
        }
    }
}
