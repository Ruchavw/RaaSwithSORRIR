package bftsmart.mvptools.replica;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.io.PrintWriter;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Thread that forwards messages from BFT replicas to SORRIR components
 */
public class ReplicaForwarderThread extends Thread {
    private final int port;
    private final BlockingQueue<String> messageQueue;
    private volatile boolean running = true;
    private ServerSocket serverSocket;
    
    public ReplicaForwarderThread(int port) {
        this.port = port;
        this.messageQueue = new LinkedBlockingQueue<>();
        this.setDaemon(true); // Don't prevent JVM shutdown
        this.setName("ReplicaForwarder-" + port);
    }
    
    public void send(String message) {
        if (running) {
            messageQueue.offer(message);
        }
    }
    
    @Override
    public void run() {
        try {
            serverSocket = new ServerSocket(port);
            System.out.println("🔗 ReplicaForwarder listening on port " + port + " for SORRIR connections");
            
            while (running) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    System.out.println("🤝 SORRIR component connected to replica forwarder on port " + port);
                    
                    // Handle the connection in a separate thread
                    new Thread(() -> handleConnection(clientSocket)).start();
                    
                } catch (IOException e) {
                    if (running) {
                        System.err.println("❌ Error accepting connection on port " + port + ": " + e.getMessage());
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to start ReplicaForwarder on port " + port + ": " + e.getMessage());
        } finally {
            cleanup();
        }
    }
    
    private void handleConnection(Socket clientSocket) {
        try (PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()))) {
            
            // Send queued messages to SORRIR component
            while (running && !clientSocket.isClosed()) {
                try {
                    String message = messageQueue.take(); // Blocking wait for messages
                    out.println(message);
                    System.out.println("📤 Forwarded to SORRIR: " + message);
                    
                    // Optional: Read response from SORRIR component
                    if (in.ready()) {
                        String response = in.readLine();
                        if (response != null) {
                            System.out.println("📥 SORRIR response: " + response);
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        } catch (IOException e) {
            System.err.println("❌ Error handling connection: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (IOException e) {
                // Ignore close errors
            }
        }
    }
    
    public void shutdown() {
        running = false;
        messageQueue.clear();
        interrupt();
        
        if (serverSocket != null && !serverSocket.isClosed()) {
            try {
                serverSocket.close();
            } catch (IOException e) {
                // Ignore close errors
            }
        }
    }
    
    private void cleanup() {
        if (serverSocket != null && !serverSocket.isClosed()) {
            try {
                serverSocket.close();
            } catch (IOException e) {
                // Ignore close errors
            }
        }
    }
}