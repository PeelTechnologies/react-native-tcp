/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

#import <Foundation/Foundation.h>
#import <Availability.h>
#import "GCDAsyncSocket.h"
#import "TcpSocketClient.h"
#import "RCTBridgeModule.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@interface TcpSockets : NSObject<SocketClientDelegate, RCTBridgeModule>

@end
