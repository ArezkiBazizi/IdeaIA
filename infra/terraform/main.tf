# Provisioning d'un Droplet Ubuntu pour héberger Docker (runtime installé via Ansible).
# DigitalOcean : simplicité ; taille s-1vcpu-2gb = 1 vCPU / 2 Go RAM.
terraform {
  required_version = ">= 1.5"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "idea_to_action" {
  image    = "ubuntu-22-04-x64"
  name     = var.droplet_name
  region   = var.region
  size     = "s-1vcpu-2gb"
  ssh_keys = var.ssh_key_ids

  user_data = <<-EOT
    #cloud-config
    package_update: true
    packages:
      - curl
  EOT

  tags = ["idea-to-action", "terraform"]
}

resource "digitalocean_firewall" "web" {
  name = "${var.droplet_name}-fw"

  droplet_ids = [digitalocean_droplet.idea_to_action.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.admin_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
