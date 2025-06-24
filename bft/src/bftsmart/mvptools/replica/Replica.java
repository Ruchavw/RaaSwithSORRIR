package bftsmart.mvptools.replica;

import bftsmart.tom.MessageContext;
import bftsmart.tom.ReplicaContext;
import bftsmart.tom.ServiceReplica;
import bftsmart.tom.core.messages.TOMMessage;
import bftsmart.tom.server.Replier;
import bftsmart.tom.server.defaultservices.DefaultRecoverable;

import java.nio.charset.StandardCharsets;

public class Replica extends DefaultRecoverable {

    private ReplicaContext rc;
    private ReplicaForwarderThread forwarderThread;
    private String configHome;
    private int replicaId;
    private ServiceReplica serviceReplica; // Store the ServiceReplica instance

    public Replica(int id, String configHome) {
        this.replicaId = id;
        this.configHome = configHome;
        
        // Create forwarder thread with a base port + replica ID to avoid conflicts
        int forwarderPort = 12000 + id; // Use different port range for forwarder
        this.forwarderThread = new ReplicaForwarderThread(forwarderPort);
        
        // Initialize BFT-SMaRt ServiceReplica - Try the simpler constructor
        // Most BFT-SMaRt applications use this constructor
        this.serviceReplica = new ServiceReplica(id, this, this);
        
        // Start the forwarder thread
        forwarderThread.start();
        
        System.out.println("✅ Replica " + id + " initialized with forwarder on port " + forwarderPort);
    }

    public static void main(String[] args) {
        System.out.println("Replica, v0.1bench");
        if (args.length < 1) {
            System.out.println("Use: java Replica <processId> [configPath]");
            System.exit(-1);
        }

        System.out.println("BFT-SMaRt -- Debugging for deployment ..");

        String configPath = args.length > 1 ? args[1] : "config";
        int replicaId = Integer.parseInt(args[0]);
        
        new Replica(replicaId, configPath);
    }

    @Override
    public byte[] appExecuteUnordered(byte[] command, MessageContext msgCtx) {
        return execute(command, msgCtx);
    }

    private byte[] execute(byte[] command, MessageContext msgCtx) {
        String request = new String(command, StandardCharsets.UTF_8).trim();
        System.out.println("📥 Replica " + replicaId + " received request: " + request);

        if (request.equalsIgnoreCase("FAULTY")) {
            System.out.println("⚠️ FAULTY command received by replica " + replicaId + ". Simulating failure...");

            try {
                Thread.sleep(1000); // Reduced sleep time to avoid timeout
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                e.printStackTrace();
            }

            String response = "Replica " + replicaId + " processed FAULTY command (with delay)";
            System.out.println("📤 Replica " + replicaId + " responding: " + response);
            return response.getBytes(StandardCharsets.UTF_8);
        }

        // Forward to SORRIR component if forwarder is available
        if (forwarderThread != null && forwarderThread.isAlive()) {
            forwarderThread.send(request);
        }
        
        // Normal response
        String response = "Replica " + replicaId + " processed: " + request;
        System.out.println("📤 Replica " + replicaId + " responding: " + response);
        return response.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public void installSnapshot(byte[] state) {
        System.out.println("📸 Replica " + replicaId + " installing snapshot");
        // Implement state recovery if needed
    }

    @Override
    public byte[] getSnapshot() {
        System.out.println("📸 Replica " + replicaId + " creating snapshot");
        return new byte[0]; // Return current state if needed
    }

    @Override
    public byte[][] appExecuteBatch(byte[][] commands, MessageContext[] msgCtxs, boolean fromConsensus) {
        System.out.println("📦 Replica " + replicaId + " executing batch of " + commands.length + " commands");
        byte[][] replies = new byte[commands.length][];
        for (int i = 0; i < commands.length; i++) {
            replies[i] = execute(commands[i], msgCtxs[i]);
        }
        return replies;
    }
}
