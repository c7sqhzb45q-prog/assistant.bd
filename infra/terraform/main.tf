terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.32"
    }
  }
}

provider "kubernetes" {
  host                   = var.kubernetes_host
  token                  = var.kubernetes_token
  cluster_ca_certificate = base64decode(var.kubernetes_ca)
}

resource "kubernetes_namespace" "assistant_bd" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name" = "assistant-bd"
      "environment"            = var.environment
    }
  }
}

resource "kubernetes_secret" "assistant_bd_runtime" {
  metadata {
    name      = "assistant-bd-secrets"
    namespace = kubernetes_namespace.assistant_bd.metadata[0].name
  }

  data = {
    DATABASE_URL        = var.database_url
    REDIS_URL           = var.redis_url
    JWT_SECRET          = var.jwt_secret
    STRIPE_SECRET_KEY   = var.stripe_secret_key
    OPENAI_API_KEY      = var.openai_api_key
    NEXT_PUBLIC_API_URL = var.next_public_api_url
  }

  type = "Opaque"
}
