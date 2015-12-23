/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"

extern NSString *const RCTTCPErrorDomain;

enum RCTTCPError
{
    RCTTCPNoError = 0,           // Never used
    RCTTCPInvalidInvocationError,// Invalid method invocation
    RCTTCPBadConfigError,        // Invalid configuration
    RCTTCPBadParamError,         // Invalid parameter was passed
    RCTTCPSendTimeoutError,      // A send operation timed out
    RCTTCPSendFailedError,       // A send operation failed
    RCTTCPClosedError,           // The socket was closed
    RCTTCPOtherError,            // Description provided in userInfo
};

typedef enum RCTTCPError RCTTCPError;

@class TcpSocketClient;

@protocol SocketClientDelegate <NSObject>

- (void)onConnect:(TcpSocketClient*)client;
- (void)onConnection:(TcpSocketClient*)client toClient:(NSNumber *)clientID;
- (void)onData:(NSNumber *)clientID data:(NSData *)data;
- (void)onClose:(TcpSocketClient*)client withError:(NSError *)err;
- (void)onError:(TcpSocketClient*)client withError:(NSError *)err;
- (NSNumber*)generateRandomId;

@end

@interface TcpSocketClient : NSObject

@property (nonatomic, retain) NSNumber * id;
@property (nonatomic, weak) id<SocketClientDelegate> clientDelegate;

///---------------------------------------------------------------------------------------
/// @name Class Methods
///---------------------------------------------------------------------------------------
/**
 * Initializes a new RCTTCPClient
 *
 * @param delegate The object holding the callbacks, usually 'self'.
 *
 * @return New RCTTCPClient
 */

+ (id)socketClientWithId:(NSNumber *)clientID andConfig:(id<SocketClientDelegate>) delegate;

///---------------------------------------------------------------------------------------
/// @name Instance Methods
///---------------------------------------------------------------------------------------
/**
 * Binds to a host and port
 *
 * @param port
 * @param host ip address
 * @return true if bound, false if there was an error
 */
- (BOOL)connect:(NSString *)host port:(int)port withOptions:(NSDictionary *)options error:(NSError **)error;

- (BOOL)listen:(NSString *)host port:(int)port error:(NSError **)error;

- (NSDictionary<NSString *, NSString *> *)getAddress;

/**
 * write data
 *
 */
- (void)writeData:(NSData*) data callback:(RCTResponseSenderBlock) callback;

/**
 * end client
 */
- (void)end;

/**
 * destroy client
 */
- (void)destroy;


@end
