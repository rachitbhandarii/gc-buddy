package com.commodity.ai.assistant;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.List;
import java.util.function.Consumer;

public interface Assistant {

    //@UserMessage({"Give me the reply of this message:"})
    @SystemMessage({"Try to use the information provided only if it is relevant to the topic asked, else use your own understanding to answer the following question."})
    String chat(@UserMessage String message);

    // void chatStream(String query, Consumer<String> consumer);
//    String summarize(String document);
//    List<String> getSources(String query);
//    void ingestDocument(String documentText);
//    String performCalculation(String expression);
//    void resetMemory();
}
