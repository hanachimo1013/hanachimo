module.exports = {
  apps : [
    {
      name: "bdl-ui",
      // Target the vite binary directly inside node_modules
      script: "./node_modules/vite/bin/vite.js",
      args: "preview",
      // We use the node interpreter because vite.js is a javascript file
      interpreter: "node", 
      env: {
        NODE_ENV: "production",
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