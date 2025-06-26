package com.commodity.ai.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.parser.TextDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.List;

import static dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument;


@Service
@Data
public class EmbeddingService {

    private final InMemoryEmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final ContentRetriever embeddingStoreContentRetriever;

    private EmbeddingService() {
        InMemoryEmbeddingStore<TextSegment> tempStore;
        try {
            tempStore = InMemoryEmbeddingStore.fromFile("./src/main/resources/embedding.store");
        } catch (Exception e) {
            tempStore = new InMemoryEmbeddingStore<>();
        }

        this.embeddingStore = tempStore;
        this.embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
        embeddingStoreContentRetriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(this.embeddingStore)
                .embeddingModel(this.embeddingModel)
                .maxResults(2)
                .minScore(0.7)
                .build();
    }

    @PreDestroy
    private void destroy() {
        embeddingStore.serializeToFile("./src/main/resources/embedding.store");
    }

    public void embed(String text) {
        TextSegment segment = TextSegment.from(text);
        Response<Embedding> response = embeddingModel.embed(segment);
        Embedding embedding = response.content();
        System.out.println(embedding);
        embeddingStore.add(embedding,segment);
    }

    public void embed(Path documentPath, EmbeddingModel embeddingModel) {
        DocumentParser documentParser = new TextDocumentParser();
        Document document = loadDocument(documentPath, documentParser);

        DocumentSplitter splitter = DocumentSplitters.recursive(300, 0);
        List<TextSegment> segments = splitter.split(document);

        List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
        embeddingStore.addAll(embeddings, segments);
    }

    // Testing
    @PostConstruct
    private void init() {
//        embed("RAG is Rachit Aakanksha Generation.");

        embed("akshat lakhera is doing intern at drdo.");
    }
}
