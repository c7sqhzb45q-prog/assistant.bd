variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "production"
}

variable "namespace" {
  type        = string
  description = "Kubernetes namespace"
  default     = "assistant-bd"
}

variable "kubernetes_host" {
  type        = string
  description = "Kubernetes API host"
}

variable "kubernetes_token" {
  type        = string
  description = "Kubernetes API token"
  sensitive   = true
}

variable "kubernetes_ca" {
  type        = string
  description = "Base64-encoded Kubernetes cluster CA certificate"
  sensitive   = true
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "next_public_api_url" {
  type = string
}
