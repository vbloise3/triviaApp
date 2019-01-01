#!/usr/bin/env bash
#/bin/bash
#build the site
npm run build
#upload files
aws s3 cp ./build s3://trivia-app-v2 --recursive --acl public-read