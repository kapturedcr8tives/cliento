#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting build optimization...');

// Analyze bundle size
function analyzeBundle() {
  console.log('📊 Analyzing bundle size...');
  try {
    execSync('npx @next/bundle-analyzer .next/stats.json', { stdio: 'inherit' });
  } catch (error) {
    console.log('Bundle analyzer not available, skipping...');
  }
}

// Optimize images
function optimizeImages() {
  console.log('🖼️  Optimizing images...');
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    try {
      execSync('npx imagemin public/**/*.{jpg,jpeg,png,svg} --out-dir=public', { stdio: 'inherit' });
    } catch (error) {
      console.log('Image optimization failed, continuing...');
    }
  }
}

// Generate sitemap
function generateSitemap() {
  console.log('🗺️  Generating sitemap...');
  try {
    execSync('npx next-sitemap', { stdio: 'inherit' });
  } catch (error) {
    console.log('Sitemap generation failed, continuing...');
  }
}

// Optimize CSS
function optimizeCSS() {
  console.log('🎨 Optimizing CSS...');
  try {
    execSync('npx postcss styles/**/*.css --dir dist/css', { stdio: 'inherit' });
  } catch (error) {
    console.log('CSS optimization failed, continuing...');
  }
}

// Check for unused dependencies
function checkUnusedDependencies() {
  console.log('🔍 Checking for unused dependencies...');
  try {
    execSync('npx depcheck', { stdio: 'inherit' });
  } catch (error) {
    console.log('Dependency check failed, continuing...');
  }
}

// Run all optimizations
async function runOptimizations() {
  try {
    checkUnusedDependencies();
    optimizeImages();
    optimizeCSS();
    generateSitemap();
    analyzeBundle();
    
    console.log('✅ Build optimization completed!');
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
}

runOptimizations();