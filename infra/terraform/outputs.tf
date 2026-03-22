output "droplet_id" {
  value = digitalocean_droplet.idea_to_action.id
}

output "droplet_ipv4" {
  value       = digitalocean_droplet.idea_to_action.ipv4_address
  description = "IP publique pour l'inventaire Ansible et le déploiement SSH."
}
