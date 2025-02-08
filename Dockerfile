# Use the official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory inside the container
WORKDIR /usr/src/app

# Create a downloads folder inside the container
RUN mkdir -p /tmp/downloads

# Switch to root user to install dependencies
USER root

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies (including express)
RUN npm install --unsafe-perm=true --allow-root puppeteer express

# Copy all other project files
COPY . .

# Switch back to non-root user for security
USER pptruser

# Expose the API port
EXPOSE 8080

# Start the Puppeteer service
CMD ["node", "server.js"]
