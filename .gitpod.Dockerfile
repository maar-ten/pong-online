FROM gitpod/workspace-full

# Install dependencies used by Chromium for Puppeteer
RUN sudo apt-get update && sudo apt-get install -y libgtk-3-0 libx11-xcb1 libnss3 libxss1 libasound2