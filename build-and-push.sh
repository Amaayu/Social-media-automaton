#!/bin/bash

# Docker Hub Build and Push Script
# Usage: ./build-and-push.sh [version]

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-yourusername}"  # Set via environment or replace
IMAGE_NAME="instagram-automation"
VERSION="${1:-1.0.0}"  # Use first argument or default to 1.0.0

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Docker Hub Build & Push Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Warning: Not logged in to Docker Hub${NC}"
    echo "Please login first:"
    echo "  docker login"
    exit 1
fi

echo -e "${BLUE}Configuration:${NC}"
echo "  Username: ${DOCKER_USERNAME}"
echo "  Image: ${IMAGE_NAME}"
echo "  Version: ${VERSION}"
echo ""

# Confirm before proceeding
read -p "Continue with build and push? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1: Building Docker image...${NC}"

# Build the image with multiple tags
docker build \
  --platform linux/amd64 \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    
    # Show image info
    echo -e "${BLUE}Image details:${NC}"
    docker images ${DOCKER_USERNAME}/${IMAGE_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
    
    echo -e "${BLUE}Step 2: Pushing to Docker Hub...${NC}"
    
    # Push version tag
    echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}..."
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
    
    # Push latest tag
    echo "Pushing ${DOCKER_USERNAME}/${IMAGE_NAME}:latest..."
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║          Push Successful! 🎉           ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${GREEN}Your image is now available at:${NC}"
        echo -e "  ${BLUE}docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"
        echo -e "  ${BLUE}docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest${NC}"
        echo ""
        echo -e "${GREEN}Docker Hub URL:${NC}"
        echo -e "  ${BLUE}https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}${NC}"
        echo ""
    else
        echo -e "${RED}✗ Push failed!${NC}"
        echo "Please check your Docker Hub credentials and try again."
        exit 1
    fi
else
    echo -e "${RED}✗ Build failed!${NC}"
    echo "Please check the error messages above and fix any issues."
    exit 1
fi
