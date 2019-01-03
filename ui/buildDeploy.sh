#!/usr/bin/env bash
#/bin/bash
#build the chalice-javascript-jdk
cd ~/triviaApp/ui/public/chalice-javascript-sdk/
rm -r *
cd ~/triviaApp/ui/public/
rmdir chalice-javascript-sdk
cd ~/triviaApp/
chalice generate-sdk ./ui/public
#build the site
cd ~/triviaApp/ui/
npm run build
#upload files
aws s3 cp ./build s3://trivia-app-v2 --recursive --acl public-read