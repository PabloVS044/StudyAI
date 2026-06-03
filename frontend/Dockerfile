FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Clerk publishable key is inlined at build time (Vite). Pass via build arg.
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_API_URL=""
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Same-origin API: vite preview proxies /api to the backend service.
RUN npx vite build

ENV VITE_PROXY_TARGET=http://backend:8000
EXPOSE 80
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "80"]
