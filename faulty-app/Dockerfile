FROM node:18
WORKDIR /app
# Copy files
COPY . .
# Create output folder
RUN mkdir -p /app/data/outputs
# Install express
RUN npm install express
CMD ["node", "server.js"]