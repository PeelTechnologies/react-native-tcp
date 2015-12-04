//
//  TcpSockets.h
//  react-native-tcp
//
//  Created by Andy Prock on 12/14/15.
//  Copyright (c) 2015 Peel, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Availability.h>
#import "GCDAsyncSocket.h"
#import "TcpSocketClient.h"
#import "RCTBridgeModule.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@interface TcpSockets : NSObject<SocketClientDelegate, RCTBridgeModule>

+(NSMutableDictionary *)clients;

@end
