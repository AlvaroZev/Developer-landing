package main

import (
	"log"
	"net/http"
	"os"

	"github.com/triunder/triunder/apps/api/internal/ai"
	"github.com/triunder/triunder/apps/api/internal/config"
	"github.com/triunder/triunder/apps/api/internal/httpapi"
)

func main() {
	cfg := config.Load()
	aiProvider := ai.NewOpenAIProvider(cfg.OpenAIAPIKey, cfg.OpenAIModel)

	router := httpapi.NewRouter(cfg, aiProvider)

	addr := ":" + cfg.Port
	log.Printf("Triunder API listening on %s (openai configured=%v)", addr, aiProvider.Configured())
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}
