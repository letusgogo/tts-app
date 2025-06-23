# Dockerfile

# Stage 1: Builder - Build the Next.js app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build script
RUN npm run build

# ---

# Stage 2: Runner - Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./
# Copy the public and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Change ownership of the files to the non-root user
RUN chown -R nextjs:nextjs .

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# The command to run the app
CMD ["node", "server.js"] 