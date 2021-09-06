# Activity Monitor

This bot will monitor your server and will enforce inactivity based on various rules.

[![Build Status](https://github.com/kmorris896/activity-monitor/actions/workflows/test.yml/badge.svg)](https://github.com/kmorris896/activity-monitor/actions/workflows/test.yml)
[![Latest Release](https://img.shields.io/github/v/release/kmorris896/activity-monitor?color=%233D9970)](https://img.shields.io/github/v/release/kmorris896/activity-monitor?color=%233D9970)

## Primary job

Rapture is setup to have an initiation screening prior to entry.  This means users must be approved before they will gain entry to the rest of the server.  When new members enter, a bot gives them a "New Arrival" role.  Once approved, this role is removed.

If you run your server in a similar way, you can use this bot to ensure that people get approved in a timely matter instead of kicked from the server.

It does this by checking the server regularly (currently hard coded to every hour) and checks to see if the member is still on the server and if the member still has the "New Arrival" role.

## Configuration

Please see this repositories wiki on how to get started.
