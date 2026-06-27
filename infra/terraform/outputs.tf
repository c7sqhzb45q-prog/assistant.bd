output "namespace" {
  value       = kubernetes_namespace.assistant_bd.metadata[0].name
  description = "Kubernetes namespace used for assistant.bd"
}

output "runtime_secret_name" {
  value       = kubernetes_secret.assistant_bd_runtime.metadata[0].name
  description = "Runtime secret resource name"
}
