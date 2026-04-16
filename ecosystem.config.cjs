module.exports = {
  apps : [
    {
      name: "bdl-server",
      // Express server serves both API routes and static dist/ files
      script: "server/index.js",
      // Use node interpreter for ES modules
      interpreter: "node",
      // Required for ES module support
      node_args: "--experimental-specifier-resolution=node",
      env: {
        NODE_ENV: "production",
        PORT: 4173,
      }
    },
    {
      name: "bdl-tunnel",
      script: "cloudflared",
      // Keep your token here
      args: "tunnel run --token eyJ6b25lSUQiOiI5ZGYxYTBjMTExNDVmYTFiYjFmOTQyNWM3ZGRlY2VkNSIsImFjY291bnRJRCI6IjMwN2IxOGZiZjdmNzhhYjIxYzUzNWE0YjAzMWQ4YWRkIiwiYXBpVG9rZW4iOiJjZnV0X3JnWmRGdEs2SWNLcXNabk1seGdtdEdZUjh3bUxUdjBRNkNnZmxwVExlZTY3YjAyMiJ9",
      autorestart: true,
    }
  ]
}