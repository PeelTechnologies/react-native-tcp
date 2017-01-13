/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

#import <Foundation/Foundation.h>
#import <Availability.h>
#import "CocoaAsyncSocket/GCDAsyncSocket.h"
#import "RCTBridgeModule.h"
#import "TcpSocketClient.h"
#import "RCTEventEmitter.h"

@interface TcpSockets : RCTEventEmitter<SocketClientDelegate>

@end
