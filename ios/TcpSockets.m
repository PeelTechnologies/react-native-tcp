//
//  TcpSockets.m
//  react-native-tcp
//
//  Created by Andy Prock on 12/14/15.
//  Copyright (c) 2015 Peel, Inc. All rights reserved.
//

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "TcpSockets.h"
#import "TcpSocketClient.h"

@implementation TcpSockets

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

+ (void) initialize {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(closeAllSockets)
                                                 name:RCTReloadNotification
                                               object:nil];
}

+(NSMutableDictionary*) clients
{
    static NSMutableDictionary* c = nil;

    static dispatch_once_t oncePredicate;

    dispatch_once(&oncePredicate, ^{
        c = [[NSMutableDictionary alloc] init];
    });

    return c;
}

RCT_EXPORT_METHOD(createSocket:(nonnull NSNumber*)cId withOptions:(NSDictionary*)options)
{
    NSMutableDictionary* _clients = [TcpSockets clients];
    if (!cId) {
        RCTLogError(@"%@.createSocket called with nil id parameter.", [self class]);
        return;
    }

    TcpSocketClient *client = [_clients objectForKey:cId];
    if (client) {
        RCTLogError(@"%@.createSocket called twice with the same id.", [self class]);
        return;
    }

    client = [TcpSocketClient socketClientWithConfig:self];
    [_clients setObject:client forKey:cId];
}

RCT_EXPORT_METHOD(connect:(nonnull NSNumber*)cId
                  port:(int)port
                  host:(NSString *)host
                  callback:(RCTResponseSenderBlock)callback)
{
    TcpSocketClient* client = [TcpSockets findClient:cId callback:callback];
    if (!client) return;

    NSError *error = nil;
    if (![client connect:port host:host error:&error])
    {
        NSString* msg = [[error userInfo] valueForKey:@"NSLocalizedFailureReason"];
        callback(@[msg]);
        return;
    }

    callback(@[[NSNull null], [NSNull null]]);
}

RCT_EXPORT_METHOD(write:(nonnull NSNumber*)cId
                  string:(NSString*)string
                  encoded:(BOOL)encoded
                  callback:(RCTResponseSenderBlock)callback) {
    TcpSocketClient* client = [TcpSockets findClient:cId callback:callback];
    if (!client) return;

    NSData *data;
    if (encoded) {
        // iOS7+
        // TODO: use https://github.com/nicklockwood/Base64 for compatibility with earlier iOS versions
        data = [[NSData alloc] initWithBase64EncodedString:string options:0];
    } else {
        data = [string dataUsingEncoding:[NSString defaultCStringEncoding]];
    }

    [client writeData:data callback:callback];
}

RCT_EXPORT_METHOD(close:(nonnull NSNumber*)cId
                  callback:(RCTResponseSenderBlock)callback) {
    [TcpSockets closeClient:cId callback:callback];
}

- (void) onData:(TcpSocketClient*) client data:(NSData *)data
{
    NSMutableDictionary* _clients = [TcpSockets clients];
    NSString *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-data", clientID]
                                                    body:@{ @"data": base64String }];
}

+(TcpSocketClient*)findClient:(nonnull NSNumber*)cId callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary* _clients = [TcpSockets clients];
    TcpSocketClient *client = [_clients objectForKey:cId];
    if (!client) {
        if (!callback) {
            RCTLogError(@"%@.missing callback parameter.", [self class]);
        }
        else {
            callback(@[[NSString stringWithFormat:@"no client found with id %@", cId]]);
        }

        return nil;
    }

    return client;
}

+(void) closeClient:(nonnull NSNumber*)cId
           callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary* _clients = [TcpSockets clients];
    TcpSocketClient* client = [TcpSockets findClient:cId callback:callback];
    if (!client) return;

    [client close];
    [_clients removeObjectForKey:cId];

    if (callback) callback(@[]);
}

+(void) closeAllSockets {
    NSMutableDictionary* _clients = [TcpSockets clients];
    for (NSNumber* cId in _clients) {
        [TcpSockets closeClient:cId callback:nil];
    }
}

@end
