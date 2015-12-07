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
    uint16_t _port;
    NSString* _address;
    GCDAsyncSocket *_tcpSocket;
    id<SocketClientDelegate> _clientDelegate;
    NSMutableDictionary* _pendingSends;
    long tag;
}

- (id)initWithConfig:(id<SocketClientDelegate>) aDelegate;

@end

@implementation TcpSocketClient

+ (id)socketClientWithConfig:(id<SocketClientDelegate>)delegate
{
    return [[[self class] alloc] initWithConfig:delegate];
}

- (id)initWithConfig:(id<SocketClientDelegate>) aDelegate
{
    self = [super init];
    if (self) {
        _clientDelegate = aDelegate;
        _pendingSends = [NSMutableDictionary dictionary];
    }

    return self;
}

- (BOOL) connect:(u_int16_t)port host:(NSString *)host error:(NSError **) error
{

    if (_port) {
        if (error) {
            *error = [self badInvocationError:@"this client's socket is already connected"];
        }

        return false;
    }

    _port = port;
    _address = host;

    _tcpSocket = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:[self methodQueue]];
    BOOL result;
    if (_address) {
        result = [_tcpSocket connectToHost:_address onPort:_port error:error];
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
    [_tcpSocket writeData:data withTimeout:-1 tag:tag];
    if (callback) {
        [_pendingSends setObject:callback forKey:[NSNumber numberWithLong:tag]];
    }

    tag++;
    [_tcpSocket readDataWithTimeout:-1 tag:-1];
}

- (void) close
{
    [_tcpSocket disconnectAfterReadingAndWriting];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag {
    if (!_clientDelegate) return;
    [_clientDelegate onData:self data:data];
    [sock readDataWithTimeout:-1 tag:-1];
}

- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port
{
    [sock readDataWithTimeout:-1 tag:-1];
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
