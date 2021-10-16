FROM node:16
ENV NODE_ENV=production

ARG GIT_COMMIT=unspecified
LABEL GIT_COMMIT=$GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

ARG SEMVER=unspecified
LABEL SEMVER=$SEMVER
ENV SEMVER=$SEMVER


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
