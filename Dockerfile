FROM node:16
ENV NODE_ENV=production

ARG SHA=unspecified
LABEL SHA=$SHA

ARG SEMVER=unspecified
LABEL semver=$SEMVER

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production

# If you are building your code for production
# RUN npm install --production --silent

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
