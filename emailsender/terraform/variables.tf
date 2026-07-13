# ─── Infrastructure connection (from primebrick-infra docker-compose) ──
variable "infra_network_name" {
  description = "Name of the Docker network created by primebrick-infra docker-compose"
  type        = string
  default     = "primebrick-infra-net"
}

variable "postgres_host" {
  description = "PostgreSQL host (container name on the infra network)"
  type        = string
  default     = "primebrick-postgres-18"
}

variable "postgres_port" {
  description = "PostgreSQL port (inside the Docker network)"
  type        = number
  default     = 5432
}

variable "postgres_user" {
  description = "PostgreSQL user"
  type        = string
  default     = "primebrick"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "primebrick"
}

# ─── This microservice's identity ──────────────────────────────────────
variable "image_name" {
  description = "Docker image name (without tag) for this microservice"
  type        = string
  default     = "primebrick/emailsender"
}

variable "image_tag" {
  description = "Docker image tag (version). Matches the git tag from GitFlow close release/hotfix. Use 'latest' for dev, or a specific version like '0.2.0' for prod."
  type        = string
  default     = "latest"
}

variable "container_name" {
  description = "Docker container name"
  type        = string
  default     = "primebrick-emailsender"
}

variable "db_schema" {
  description = "Database schema for this microservice"
  type        = string
  default     = "emailsender"
}

variable "internal_port" {
  description = "Container-internal HTTP port (always 3003)"
  type        = number
  default     = 3003
}

# ─── Dynamic port (set by deploy script) ───────────────────────────────
variable "host_port" {
  description = "Host port to expose the microservice on. Set by deploy script (find-available-port). NOT hardcoded — found dynamically at deploy time."
  type        = number
  # No default — must be provided by deploy script
}

# ─── SERVICE_BASE_URL (ENV exception — see analysis in plan) ───────────
variable "service_base_url" {
  description = "Exposed URL that the BE proxy uses to reach this microservice. Must be http://localhost:{host_port} because the BE runs on the host. Set by deploy script."
  type        = string
  # No default — must be provided by deploy script
}
