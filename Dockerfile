FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if it exists)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with pnpm
RUN pnpm install

# Copy the rest of the source code
COPY . .

# Build the application
RUN pnpm build

EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
