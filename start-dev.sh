#!/bin/bash
cd E:/Dralvo/dralvo-landing
npm run dev > /tmp/nextjs-dev.log 2>&1 &
echo $!
