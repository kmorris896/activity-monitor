FROM node:14
ENV NODE_ENV=production
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install 

# If you are building your code for production
# RUN npm install --production --silent

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "index.js" ]
