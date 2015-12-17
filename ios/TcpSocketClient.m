//
//  TcpSocketClient.m
//  react-native-tcp
//
//  Created by Andy Prock on 12/14/15.
//  Copyright (c) 2015 peel, Inc. All rights reserved.
//

#import <netinet/in.h>
#import <arpa/inet.h>
#import "TcpSocketClient.h"
#import "RCTBridgeModule.h"
#import "GCDAsyncSocket.h"

NSString *const RCTTCPErrorDomain = @"RCTTCPErrorDomain";

@interface TcpSocketClient()
{
@private
    GCDAsyncSocket *_tcpSocket;
    id<SocketClientDelegate> _clientDelegate;
    NSMutableDictionary<NSNumber *, RCTResponseSenderBlock> *_pendingSends;
    long _sendTag;
}

- (id)initWithClientId:(NSNumber *)clientID andConfig:(id<SocketClientDelegate>) aDelegate;

@end

@implementation TcpSocketClient

+ (id)socketClientWithId:(nonnull NSNumber *)clientID andConfig:(id<SocketClientDelegate>)delegate
{
    return [[[self class] alloc] initWithClientId:clientID andConfig:delegate];
}

- (id)initWithClientId:(NSNumber *)clientID andConfig:(id<SocketClientDelegate>) aDelegate
{
    self = [super init];
    if (self) {
        _id = clientID;
        _clientDelegate = aDelegate;
        _pendingSends = [NSMutableDictionary dictionary];
    }

    return self;
}

- (BOOL)connect:(NSString *)host port:(int)port withOptions:(NSDictionary *)options error:(NSError **)error
{
    if (_tcpSocket) {
        if (error) {
            *error = [self badInvocationError:@"this client's socket is already connected"];
        }

        return false;
    }

    _tcpSocket = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:[self methodQueue]];
    BOOL result = false;

    NSString *localAddress = (options?options[@"localAddress"]:nil);
    NSNumber *localPort = (options?options[@"localPort"]:nil);

    if (!localAddress && !localPort) {
        result = [_tcpSocket connectToHost:host onPort:port error:error];
    } else {
        NSMutableArray *interface = [NSMutableArray arrayWithCapacity:2];
        [interface addObject: localAddress?localAddress:@""];
        if (localPort) {
            [interface addObject:[localPort stringValue]];
        }
        result = [_tcpSocket connectToHost:host
                                    onPort:port
                              viaInterface:[interface componentsJoinedByString:@":"]
                               withTimeout:-1
                                     error:error];
    }

    return result;
}

- (void)socket:(GCDAsyncSocket *)sock didWriteDataWithTag:(long)msgTag
{
    NSNumber* tagNum = [NSNumber numberWithLong:msgTag];
    RCTResponseSenderBlock callback = [_pendingSends objectForKey:tagNum];
    if (callback) {
        callback(@[]);
        [_pendingSends removeObjectForKey:tagNum];
    }
}

- (void) writeData:(NSData *)data
          callback:(RCTResponseSenderBlock)callback
{
    [_tcpSocket writeData:data withTimeout:-1 tag:_sendTag];
    if (callback) {
        [_pendingSends setObject:callback forKey:[NSNumber numberWithLong:_sendTag]];
    }

    _sendTag++;

    [_tcpSocket readDataWithTimeout:-1 tag:-1];
}

- (void)end
{
    [_tcpSocket disconnectAfterWriting];
}

- (void)destroy
{
    [_tcpSocket disconnect];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag {
    if (!_clientDelegate) return;
    [_clientDelegate onData:self data:data];

    [sock readDataWithTimeout:-1 tag:-1];
}

- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port
{
    if (!_clientDelegate) return;
    [_clientDelegate onConnect:self];

    [sock readDataWithTimeout:-1 tag:-1];
}

- (void)socketDidCloseReadStream:(GCDAsyncSocket *)sock
{
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err
{
    if (!_clientDelegate) return;
    [_clientDelegate onClose:self withError:err];
}

- (NSError *)badParamError:(NSString *)errMsg
{
    NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

    return [NSError errorWithDomain:RCTTCPErrorDomain
                               code:RCTTCPBadParamError
                           userInfo:userInfo];
}

- (NSError *)badInvocationError:(NSString *)errMsg
{
    NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

    return [NSError errorWithDomain:RCTTCPErrorDomain
                               code:RCTTCPInvalidInvocationError
                           userInfo:userInfo];
}

- (NSError *)sendFailedError:(NSString *)errMsg
{
    NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

    return [NSError errorWithDomain:RCTTCPErrorDomain
                               code:RCTTCPSendFailedError
                           userInfo:userInfo];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

@end
