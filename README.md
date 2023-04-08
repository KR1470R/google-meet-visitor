
<div align="center">

<h1>google-meet-visitor <sup>5.0.0</sup></h1>

<img  src="./assets/logo.png">

</div>

  

# What it does

The main purpose of google-meet-visitor is just visit calls in google meet. The main feature is that you can record this calls. It will automate all user actions like join to call, mute the browser, submitting that you are in the call, etc.

  

# Requirements

Google Chrome **>=** 100;

Node **>=** 16.18.1;

Selenium **>=** 4.1.13;

Electron **>=** 24;

  

# Usage

## Installation

git clone git@github.com:KR1470R/google-meet-visitor.git

npm ci

## Configuration

All the config parameters are stored in the .env file in root of the project. Also, you can specify it by yourself without .env, just define these variables in your global environment. Variables with asterisk* are important, you won't be able to run the program without them.

### All used variables and explanation:

**USER_DATA_DIR*** - here you should specify the path to your google chrome profile directory. See here.\

**TARGET_CALL_LINK*** - link to your google meet call.\

**CALL_TIMER_MINUTES*** - how many minutes the visitor must stay at call¿\

**MINIMIZED** - true or false. If true, the window of the browser will be minimized. By default false.\

**MUTE** - true or false. If true, the browser will be totally mute. By default false.\

**RECORD_TAB** - true or false. If true, the visitor will record the call. By default false. See here.\

**OUTPUT_RECORD_TAB** - custom path of output records. By default is dist/records/ in the root.

## Run

Just go to the root directory of the google-meet-visitor and type the command:

  

npm run start

## Record calls

As i mentioned above you can record your calls. But there is a few nuances, while you recording, if you minimize your window then it won't record the tab so that the output video will be lagged till you maximaze the window back. But you can just open other windows over the browser with google-meet-visitor and just don't nevermind it while recording.

  

# FAQ

## How to get USER_DATA_DIR?

The main purpose of using user data directory is to automate authorization of user in google meet. Don't worry, it doesn't steal your data.

1. Open your google chrome.

2. Open this link [chrome://version/](chrome://version/)

3. Copy the path in a **Profile Path** column and paste to your USER_DATA_DIR variable.

<img align="center"  src="./assets/profile_path.png">

  

## Why does visitor webdriver use minimized option instead of headless?

Well, on the initial stages of the development that was thought that visitor should run with headless option, at least for non-recording mode. But, i faced with a lot of problem by doing it, i couldn't even join to call with headless mode, i have tried a lot of options, nevertheless google meet just have blocked it. So the only solution i came up with is just use minimized mode.

  

# Bugs and issues

### I would very glad for your contributions. Any questions, issues and suggestions will be welcome!

# Licence

![enter image description here](https://upload.wikimedia.org/wikipedia/commons/f/f8/License_icon-mit-88x31-2.svg)

![enter image description here](https://camo.githubusercontent.com/d5b96d374ea9039f533b8fbb39e8e56964e9281dbf80315b7cef7242a1a21512/68747470733a2f2f6d6972726f72732e6372656174697665636f6d6d6f6e732e6f72672f70726573736b69742f627574746f6e732f38387833312f7376672f62792d6e632e737667)

# TODO

- correct output videos format

- ensure support for windows

- make alternative configuration of google-meet-visitor - by using flags in the command line.
