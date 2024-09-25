import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; 
import { firestore } from '../firebaseConfig';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ ...doc.data(), id: doc.id } as User);
      });
      setUsers(usersList);
      setFilteredUsers(usersList);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      console.error('Error fetching users: ', error);
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) || 
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);

  const deleteUser = async (userId: string) => {
    setLoadingAction(true);
    try {
      await deleteDoc(doc(firestore, 'users', userId));
    } catch (error: any) {
      setErrorMessage('Error deleting user: ' + error.message);
      console.error('Error deleting user: ', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const resetEditing = () => {
    setEditingUser(null);
    setErrorMessage(null);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TextInput
        placeholder="Search users..."
        value={searchText}
        onChangeText={setSearchText}
        style={styles.input}
      />

      {!editingUser && (
        <AddUserForm 
          onAddComplete={resetEditing} 
          setErrorMessage={setErrorMessage}
        />
      )}

      {editingUser && (
        <EditUserForm 
          user={editingUser} 
          onEditComplete={resetEditing} 
          setErrorMessage={setErrorMessage}
        />
      )}

      {loadingAction && <ActivityIndicator style={styles.loading} />}

      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <View style={styles.userInfo}>
              <Text style={styles.userText}>
                {item.name} - {item.email} - {item.age} years old
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setEditingUser(item)}
              >
                <Text style={styles.iconText}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => deleteUser(item.id)}
              >
                <Text style={styles.iconText}>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id} 
      />
    </View>
  );
};

const AddUserForm = ({ onAddComplete, setErrorMessage }: { onAddComplete: () => void; setErrorMessage: (msg: string | null) => void; }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [age, setAge] = useState<number | string>(''); 

  const validateInputs = (): boolean => {
    if (!name) {
      setErrorMessage('Name is required.');
      return false;
    }
    if (!email) {
      setErrorMessage('Email is required.');
      return false;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      setErrorMessage('Valid age is required.');
      return false;
    }
    setErrorMessage(null); 
    return true;
  };

  const addUser = async () => {
    if (!validateInputs()) return;
    try {
      await addDoc(collection(firestore, 'users'), { name, email, age: Number(age) });
      onAddComplete();
      setName('');  // Reset input
      setEmail(''); // Reset input
      setAge('');   // Reset input
    } catch (error: any) {
      setErrorMessage('Error adding user: ' + error.message);
      console.error('Error adding user: ', error);
    }
  };

  return (
    <View style={styles.formContainer}>
      <TextInput 
        placeholder="Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Age" 
        value={age.toString()} 
        onChangeText={setAge} 
        keyboardType="numeric"
        style={styles.input} 
      />
      <TouchableOpacity 
        style={[styles.button, styles.addButton]} 
        onPress={addUser}
      >
        <Text style={styles.iconText}>➕</Text>
        <Text style={styles.buttonText}>Add User</Text>
      </TouchableOpacity>
    </View>
  );
};

const EditUserForm = ({ user, onEditComplete, setErrorMessage }: { user: User; onEditComplete: () => void; setErrorMessage: (msg: string | null) => void; }) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [age, setAge] = useState<number | string>(user.age);

  const validateInputs = (): boolean => {
    if (!name) {
      setErrorMessage('Name is required.');
      return false;
    }
    if (!email) {
      setErrorMessage('Email is required.');
      return false;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      setErrorMessage('Valid age is required.');
      return false;
    }
    setErrorMessage(null); 
    return true;
  };

  const editUser = async () => {
    if (!validateInputs()) return;

    try {
      await updateDoc(doc(firestore, 'users', user.id), { name, email, age: Number(age) });
      onEditComplete();
    } catch (error: any) {
      setErrorMessage('Error updating user: ' + error.message);
      console.error('Error updating user: ', error);
    }
  };

  return (
    <View style={styles.formContainer}>
      <TextInput 
        placeholder="Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Age" 
        value={age.toString()} 
        onChangeText={setAge} 
        keyboardType="numeric"
        style={styles.input} 
      />
      <TouchableOpacity 
        style={[styles.button, styles.editButton]} 
        onPress={editUser}
      >
        <Text style={styles.iconText}>✏️</Text>
        <Text style={styles.buttonText}>Update User</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e3f2fd', // Màu nền xanh nhạt
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e88e5', // Màu chữ xanh đậm
  },
  input: {
    borderWidth: 1,
    borderColor: '#90caf9', // Màu viền input
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#424242',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  iconText: {
    fontSize: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#90caf9', // Màu viền danh sách
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
  },
  userInfo: {
    flex: 1,
  },
  userText: {
    fontSize: 16,
    color: '#343a40',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    padding: 10,
  },
  loading: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  formContainer: {
    marginBottom: 20,
  },
});

export default App;
