//
//  TcpSocketClient.h
//  react-native-tcp
//
//  Created by Andy Prock on 12/14/15.
//  Copyright (c) 2015 Peel, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"

extern NSString *const RCTUDPErrorDomain;

enum RCTUDPError
{
    RCTUDPNoError = 0,           // Never used
    RCTUDPInvalidInvocationError,// Invalid method invocation
    RCTUDPBadConfigError,        // Invalid configuration
    RCTUDPBadParamError,         // Invalid parameter was passed
    RCTUDPSendTimeoutError,      // A send operation timed out
    RCTUDPSendFailedError,       // A send operation failed
    RCTUDPClosedError,           // The socket was closed
    RCTUDPOtherError,            // Description provided in userInfo
};

typedef enum RCTUDPError RCTUDPError;

@class TcpSocketClient;

@protocol SocketClientDelegate <NSObject>

- (void)onData:(TcpSocketClient*) client data:(NSData *)data;

@end

@interface TcpSocketClient : NSObject

@property (nonatomic, retain) NSString* id;
@property (nonatomic, retain) NSString* host;
@property (nonatomic) u_int16_t port;

///---------------------------------------------------------------------------------------
/// @name Class Methods
///---------------------------------------------------------------------------------------
/**
 * Initializes a new RCTUDPClient
 *
 * @param delegate The object holding the callbacks, usually 'self'.
 *
 * @return New RCTUDPClient
 */

+ (id)socketClientWithConfig:(id<SocketClientDelegate>) delegate;

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
- (BOOL)connect:(u_int16_t) port host:(NSString*) host error:(NSError**)error;

/**
 * write data
 *
 */
- (void)writeData:(NSData*) data callback:(RCTResponseSenderBlock) callback;

/**
 * close client
 */
- (void)close;


@end
