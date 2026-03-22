variable "do_token" {
  description = "Jeton API DigitalOcean (variable d'environnement TF_VAR_do_token ou fichier tfvars non versionné)."
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Région DO (ex: fra1, nyc3)."
  type        = string
  default     = "fra1"
}

variable "droplet_name" {
  type    = string
  default = "idea-to-action"
}

variable "ssh_key_ids" {
  description = "Identifiants des clés SSH enregistrées sur le compte DO (pour l'accès root initial)."
  type        = list(string)
}

variable "admin_cidrs" {
  description = "Plages IP autorisées pour SSH (restreindre en production)."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}
