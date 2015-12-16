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

+(NSMutableDictionary<NSNumber *,TcpSocketClient *> *) clients
{
    static NSMutableDictionary* c = nil;

    static dispatch_once_t oncePredicate;

    dispatch_once(&oncePredicate, ^{
        c = [[NSMutableDictionary alloc] init];
    });

    return c;
}

RCT_EXPORT_METHOD(createSocket:(nonnull NSNumber*)cId)
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
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
                  host:(NSString *)host
                  port:(int)port
                  withOptions:(NSDictionary *)options)
{
    TcpSocketClient* client = [TcpSockets findClient:cId callback:nil];
    if (!client) return;

    NSError *error = nil;
    if (![client connect:host port:port withOptions:options error:&error])
    {
        [self onError:client withError:error];
        return;
    }
}

RCT_EXPORT_METHOD(write:(nonnull NSNumber*)cId
                  string:(NSString *)string
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

RCT_EXPORT_METHOD(end:(nonnull NSNumber*)cId
                  callback:(RCTResponseSenderBlock)callback) {
    [TcpSockets endClient:cId callback:callback];
}

RCT_EXPORT_METHOD(destroy:(nonnull NSNumber*)cId) {
    [TcpSockets destroyClient:cId];
}

- (void) onConnect:(TcpSocketClient*) client
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-event", clientID]
                                                    body:@{ @"event": @"connect" }];
}

- (void) onData:(TcpSocketClient*) client data:(NSData *)data
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-event", clientID]
                                                    body:@{ @"event": @"data", @"data": base64String }];
}

- (void) onClose:(TcpSocketClient*) client withError:(NSError *)err
{
    [self onError:client withError:err];

    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];

    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-event", clientID]
                                                    body:@{ @"event": @"close", @"data": err == nil ? @NO : @YES }];
}

- (void)onError:(TcpSocketClient*) client withError:(NSError *)err {
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];

    NSString* msg = [[err userInfo] valueForKey:@"NSLocalizedFailureReason"];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-event", clientID]
                                                    body:@{ @"event": @"error", @"data": @[msg] }];

}

+(TcpSocketClient*)findClient:(nonnull NSNumber*)cId callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
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

+(void) endClient:(nonnull NSNumber*)cId
           callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    TcpSocketClient* client = [TcpSockets findClient:cId callback:callback];
    if (!client) return;

    [client end];
    [_clients removeObjectForKey:cId];

    if (callback) callback(@[]);
}

+(void) destroyClient:(nonnull NSNumber*)cId
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    TcpSocketClient* client = [TcpSockets findClient:cId callback:nil];
    if (!client) return;

    [client destroy];
    [_clients removeObjectForKey:cId];
}

+(void) closeAllSockets {
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients = [TcpSockets clients];
    for (NSNumber* cId in _clients) {
        [TcpSockets endClient:cId callback:nil];
    }
}

@end
