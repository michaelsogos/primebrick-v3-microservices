terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0"
    }
  }
}

provider "docker" {}

# ─── Data source: find the infra network (created by docker-compose) ────
data "docker_network" "infra" {
  name = var.infra_network_name
}

# ─── This microservice's container (single resource, no for_each) ───────
resource "docker_container" "microservice" {
  name  = var.container_name
  image = "${var.image_name}:${var.image_tag}"

  # Expose the microservice port on the host
  # host_port is dynamic (found by deploy script), internal_port is always 3003
  ports {
    internal = var.internal_port
    external = var.host_port
  }

  # Join the shared infra network
  networks {
    network_id = data.docker_network.infra.id
  }

  # Environment variables — only true primitives + SERVICE_BASE_URL exception.
  # Everything else comes from the emailsender.config table at startup.
  env = [
    "DATABASE_URL=postgresql://${var.postgres_user}:${var.postgres_password}@${var.postgres_host}:${var.postgres_port}/${var.postgres_db}",
    "DB_SCHEMA=${var.db_schema}",
    "SERVICE_BASE_URL=${var.service_base_url}",
    "NODE_ENV=production",
  ]

  restart = "unless-stopped"

  # Healthcheck — internal port is always 3003
  healthcheck {
    test     = ["CMD-SHELL", "bun -e \"fetch('http://localhost:3003/health').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))\""]
    interval = "30s"
    timeout  = "10s"
    retries  = 3
  }
}
