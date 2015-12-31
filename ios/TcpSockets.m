/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "TcpSockets.h"
#import "TcpSocketClient.h"

// offset native ids by 5000
#define COUNTER_OFFSET 5000

@implementation TcpSockets
{
    NSMutableDictionary<NSNumber *,TcpSocketClient *> *_clients;
    int _counter;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

-(void)dealloc
{
    for (NSNumber *cId in _clients.allKeys) {
        [self destroyClient:cId];
    }
}

- (TcpSocketClient *)createSocket:(nonnull NSNumber*)cId
{
    if (!cId) {
        RCTLogError(@"%@.createSocket called with nil id parameter.", [self class]);
        return nil;
    }

    if (!_clients) {
        _clients = [NSMutableDictionary new];
    }

    if (_clients[cId]) {
        RCTLogError(@"%@.createSocket called twice with the same id.", [self class]);
        return nil;
    }

    _clients[cId] = [TcpSocketClient socketClientWithId:cId andConfig:self];

    return _clients[cId];
}

RCT_EXPORT_METHOD(connect:(nonnull NSNumber*)cId
                  host:(NSString *)host
                  port:(int)port
                  withOptions:(NSDictionary *)options)
{
    TcpSocketClient *client = _clients[cId];
    if (!client) {
      client = [self createSocket:cId];
    }

    NSError *error = nil;
    if (![client connect:host port:port withOptions:options error:&error])
    {
        [self onError:client withError:error];
        return;
    }
}

RCT_EXPORT_METHOD(write:(nonnull NSNumber*)cId
                  string:(NSString *)base64String
                  callback:(RCTResponseSenderBlock)callback) {
    TcpSocketClient* client = [self findClient:cId];
    if (!client) return;

    // iOS7+
    // TODO: use https://github.com/nicklockwood/Base64 for compatibility with earlier iOS versions
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    [client writeData:data callback:callback];
}

RCT_EXPORT_METHOD(end:(nonnull NSNumber*)cId) {
    [self endClient:cId];
}

RCT_EXPORT_METHOD(destroy:(nonnull NSNumber*)cId) {
    [self destroyClient:cId];
}

RCT_EXPORT_METHOD(listen:(nonnull NSNumber*)cId
                  host:(NSString *)host
                  port:(int)port)
{
    TcpSocketClient* client = _clients[cId];
    if (!client) {
      client = [self createSocket:cId];
    }

    NSError *error = nil;
    if (![client listen:host port:port error:&error])
    {
        [self onError:client withError:error];
        return;
    }
}

- (void)onConnect:(TcpSocketClient*) client
{
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-connect", client.id]
                                                    body:[client getAddress]];
}

-(void)onConnection:(TcpSocketClient *)client toClient:(NSNumber *)clientID {
    _clients[client.id] = client;

    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-connection", clientID]
                                                    body:@{ @"id": client.id, @"address" : [client getAddress] }];
}

- (void)onData:(NSNumber *)clientID data:(NSData *)data
{
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-data", clientID]
                                                    body:base64String];
}

- (void)onClose:(TcpSocketClient*) client withError:(NSError *)err
{
    if (err) {
      [self onError:client withError:err];
    }

    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-close", client.id]
                                                    body:err == nil ? @NO : @YES];

    client.clientDelegate = nil;
    [_clients removeObjectForKey:client.id];
}

- (void)onError:(TcpSocketClient*) client withError:(NSError *)err {
    NSString *msg = err.localizedFailureReason ?: err.localizedDescription;
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-error", client.id]
                                                    body:msg];

}

-(TcpSocketClient*)findClient:(nonnull NSNumber*)cId
{
    TcpSocketClient *client = _clients[cId];
    if (!client) {
        NSString *msg = [NSString stringWithFormat:@"no client found with id %@", cId];
        [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"tcp-%@-error", cId]
                                                        body:msg];
        return nil;
    }

    return client;
}

-(void)endClient:(nonnull NSNumber*)cId
{
    TcpSocketClient* client = [self findClient:cId];
    if (!client) return;

    [client end];
}

-(void)destroyClient:(nonnull NSNumber*)cId
{
    TcpSocketClient* client = [self findClient:cId];
    if (!client) return;

    [client destroy];
    [_clients removeObjectForKey:cId];
}

-(NSNumber*)getNextId {
    return @(_counter++ + COUNTER_OFFSET);
}

@end
